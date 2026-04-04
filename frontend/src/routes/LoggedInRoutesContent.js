import React, { useContext, useEffect, useMemo, useState } from "react";
import { Switch, Route, Redirect } from "react-router-dom";
import { AuthContext } from "../context/Auth/AuthContext";
import { Can } from "../components/Can";
import usePlans from "../hooks/usePlans";
import ModuleTabsLayout from "../layout/ModuleTabsLayout";
import { i18n } from "../translate/i18n";

import Dashboard from "../pages/Dashboard/";
import TicketResponsiveContainer from "../pages/TicketResponsiveContainer";
import Connections from "../pages/Connections/";
import SettingsCustom from "../pages/SettingsCustom/";
import Financeiro from "../pages/Financeiro/";
import Users from "../pages/Users";
import Contacts from "../pages/Contacts/";
import Queues from "../pages/Queues/";
import Setores from "../pages/Setores/";
import Tags from "../pages/Tags/";
import MessagesAPI from "../pages/MessagesAPI/";
import Helps from "../pages/Helps/";
import ContactLists from "../pages/ContactLists/";
import ContactListItems from "../pages/ContactListItems/";
import QuickMessages from "../pages/QuickMessages/";
import Kanban from "../pages/Kanban";
import GroupManager from "../pages/GroupManager";
import Schedules from "../pages/Schedules";
import Campaigns from "../pages/Campaigns";
import CampaignsConfig from "../pages/CampaignsConfig";
import CampaignReport from "../pages/CampaignReport";
import Annoucements from "../pages/Annoucements";
import Chat from "../pages/Chat";
import ToDoList from "../pages/ToDoList/";
import Subscription from "../pages/Subscription/";
import Files from "../pages/Files/";
import Prompts from "../pages/Prompts";
import QueueIntegration from "../pages/QueueIntegration";
import CampaignsPhrase from "../pages/CampaignsPhrase";
import FlowBuilder from "../pages/FlowBuilder";
import FlowBuilderConfig from "../pages/FlowBuilderConfig";
import Evaluation from "../pages/Evaluation";
import Reports from "../pages/Reports";

function usePlanFlags() {
  const { user } = useContext(AuthContext);
  const { getPlanCompany } = usePlans();
  const [flags, setFlags] = useState({
    useCampaigns: false,
    useKanban: false,
    useOpenAi: false,
    useIntegrations: false,
    useSchedules: false,
    useExternalApi: false,
    loaded: false,
  });

  useEffect(() => {
    if (!user?.companyId) return;
    let cancelled = false;
    (async () => {
      try {
        const planConfigs = await getPlanCompany(undefined, user.companyId);
        if (cancelled || !planConfigs?.plan) return;
        const p = planConfigs.plan;
        setFlags({
          useCampaigns: !!p.useCampaigns,
          useKanban: !!p.useKanban,
          useOpenAi: !!p.useOpenAi,
          useIntegrations: !!p.useIntegrations,
          useSchedules: !!p.useSchedules,
          useExternalApi: !!p.useExternalApi,
          loaded: true,
        });
      } catch {
        if (!cancelled) setFlags((f) => ({ ...f, loaded: true }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.companyId, getPlanCompany]);

  useEffect(() => {
    if (localStorage.getItem("cshow")) {
      setFlags((f) => ({ ...f, useCampaigns: true }));
    }
  }, []);

  return flags;
}

function DashboardRouteGuard() {
  const { user } = useContext(AuthContext);
  return (
    <Can
      role={user.profile}
      perform="dashboard:view"
      yes={() => <DashboardModule />}
      no={() => <Redirect to="/tickets" />}
    />
  );
}

function DashboardModule() {
  const tabs = useMemo(
    () => [
      { path: "/", label: i18n.t("mainDrawer.listItems.dashboard") },
      { path: "/relatorios", label: i18n.t("mainDrawer.listItems.reports") },
    ],
    [i18n.language]
  );
  return (
    <ModuleTabsLayout tabs={tabs}>
      <Switch>
        <Route exact path="/" component={Dashboard} />
        <Route exact path="/relatorios" component={Reports} />
      </Switch>
    </ModuleTabsLayout>
  );
}

function AtendimentoModule({ planFlags, isAdmin }) {
  const tabs = useMemo(() => {
    const t = [{ path: "/tickets", label: i18n.t("mainDrawer.listItems.tickets") }];
    if (planFlags.useKanban) {
      t.push({ path: "/kanban", label: i18n.t("mainDrawer.listItems.kanban") });
    }
    t.push({ path: "/contacts", label: i18n.t("mainDrawer.listItems.contacts") });
    if (isAdmin) {
      t.push({ path: "/group-manager", label: i18n.t("mainDrawer.listItems.groups") });
    }
    t.push({ path: "/todolist", label: i18n.t("mainDrawer.listItems.tasks") });
    if (planFlags.useSchedules) {
      t.push({ path: "/schedules", label: i18n.t("mainDrawer.listItems.schedules") });
    }
    return t;
  }, [planFlags.useKanban, planFlags.useSchedules, isAdmin, i18n.language]);

  return (
    <ModuleTabsLayout tabs={tabs}>
      <Switch>
        <Route exact path="/tickets/:ticketId?" component={TicketResponsiveContainer} />
        <Route exact path="/kanban" component={Kanban} />
        <Route exact path="/contacts" component={Contacts} />
        <Route exact path="/group-manager" component={GroupManager} />
        <Route exact path="/todolist" component={ToDoList} />
        <Route exact path="/schedules" component={Schedules} />
      </Switch>
    </ModuleTabsLayout>
  );
}

function AutomacaoModule({ planFlags, isAdmin }) {
  const tabs = useMemo(() => {
    const t = [];
    if (isAdmin && planFlags.useCampaigns) {
      t.push(
        { path: "/flowbuilders", label: i18n.t("mainDrawer.listItems.flowsChatbot") },
        { path: "/phrase-lists", label: i18n.t("mainDrawer.listItems.keywordsTrigger") }
      );
    }
    if (isAdmin && planFlags.useIntegrations) {
      t.push({ path: "/queue-integration", label: i18n.t("mainDrawer.listItems.integrations") });
    }
    if (isAdmin && planFlags.useOpenAi) {
      t.push({ path: "/prompts", label: i18n.t("mainDrawer.listItems.prompts") });
    }
    t.push({ path: "/quick-messages", label: i18n.t("mainDrawer.listItems.quickMessages") });
    return t;
  }, [planFlags.useCampaigns, planFlags.useIntegrations, planFlags.useOpenAi, isAdmin, i18n.language]);

  return (
    <ModuleTabsLayout tabs={tabs}>
      <Switch>
        {planFlags.useCampaigns && (
          <>
            <Route exact path="/phrase-lists" component={CampaignsPhrase} />
            <Route exact path="/flowbuilders" component={FlowBuilder} />
            <Route exact path="/flowbuilder/:id?" component={FlowBuilderConfig} />
          </>
        )}
        {planFlags.useIntegrations && (
          <Route exact path="/queue-integration" component={QueueIntegration} />
        )}
        {planFlags.useOpenAi && <Route exact path="/prompts" component={Prompts} />}
        <Route exact path="/quick-messages" component={QuickMessages} />
      </Switch>
    </ModuleTabsLayout>
  );
}

function CampanhasModule() {
  const tabs = useMemo(
    () => [
      { path: "/campaigns", label: i18n.t("mainDrawer.listItems.campaigns") },
      { path: "/contact-lists", label: i18n.t("mainDrawer.listItems.contactLists") },
      { path: "/campaigns-config", label: i18n.t("mainDrawer.listItems.campaignSettings") },
    ],
    [i18n.language]
  );
  return (
    <ModuleTabsLayout tabs={tabs}>
      <Switch>
        <Route exact path="/campaigns" component={Campaigns} />
        <Route exact path="/contact-lists" component={ContactLists} />
        <Route exact path="/contact-lists/:contactListId/contacts" component={ContactListItems} />
        <Route exact path="/campaigns-config" component={CampaignsConfig} />
        <Route exact path="/campaign/:campaignId/report" component={CampaignReport} />
      </Switch>
    </ModuleTabsLayout>
  );
}

function EquipeModule({ isAdmin }) {
  const tabs = useMemo(() => {
    if (isAdmin) {
      return [
        { path: "/users", label: i18n.t("mainDrawer.listItems.users") },
        { path: "/setores", label: i18n.t("mainDrawer.listItems.sectors") },
        { path: "/chats", label: i18n.t("mainDrawer.listItems.chats") },
      ];
    }
    return [{ path: "/chats", label: i18n.t("mainDrawer.listItems.chats") }];
  }, [isAdmin, i18n.language]);

  return (
    <ModuleTabsLayout tabs={tabs}>
      <Switch>
        <Route exact path="/users" component={Users} />
        <Route exact path="/setores" component={Setores} />
        <Route exact path="/queues" component={Queues} />
        <Route exact path="/chats/:id?" component={Chat} />
      </Switch>
    </ModuleTabsLayout>
  );
}

function ConfiguracoesModule({ showExternalApi }) {
  const tabs = useMemo(() => {
    const t = [{ path: "/connections", label: i18n.t("mainDrawer.listItems.connections") }];
    if (showExternalApi) {
      t.push({ path: "/messages-api", label: i18n.t("mainDrawer.listItems.messagesAPI") });
    }
    t.push({ path: "/settings", label: i18n.t("mainDrawer.listItems.settings") });
    return t;
  }, [showExternalApi, i18n.language]);

  return (
    <ModuleTabsLayout tabs={tabs}>
      <Switch>
        <Route exact path="/connections" component={Connections} />
        <Route exact path="/messages-api" component={MessagesAPI} />
        <Route exact path="/settings" component={SettingsCustom} />
      </Switch>
    </ModuleTabsLayout>
  );
}

export default function LoggedInRoutesContent() {
  const { user } = useContext(AuthContext);
  const planFlags = usePlanFlags();
  const isAdmin = user?.profile === "admin";

  const atendimentoPaths = [
    "/tickets/:ticketId?",
    "/kanban",
    "/contacts",
    "/group-manager",
    "/todolist",
    "/schedules",
  ];

  const automacaoPathsBase = ["/queue-integration", "/prompts", "/quick-messages"];
  const automacaoPaths = planFlags.useCampaigns
    ? ["/phrase-lists", "/flowbuilders", "/flowbuilder/:id?", ...automacaoPathsBase]
    : automacaoPathsBase;

  const campanhasPaths = [
    "/campaigns",
    "/contact-lists",
    "/contact-lists/:contactListId/contacts",
    "/campaigns-config",
    "/campaign/:campaignId/report",
  ];

  const equipePaths = ["/users", "/setores", "/queues", "/chats/:id?"];

  const configPaths = ["/connections", "/messages-api", "/settings"];

  return (
    <Switch>
      <Route exact path={["/", "/relatorios"]} component={DashboardRouteGuard} />

      <Route
        path={atendimentoPaths}
        render={() => <AtendimentoModule planFlags={planFlags} isAdmin={isAdmin} />}
      />

      {!planFlags.useCampaigns && (
        <>
          <Route exact path="/flowbuilders" render={() => <Redirect to="/quick-messages" />} />
          <Route exact path="/flowbuilder/:id?" render={() => <Redirect to="/quick-messages" />} />
          <Route exact path="/phrase-lists" render={() => <Redirect to="/quick-messages" />} />
        </>
      )}

      <Route path={automacaoPaths} render={() => <AutomacaoModule planFlags={planFlags} isAdmin={isAdmin} />} />

      {!planFlags.useCampaigns && (
        <Route
          path={["/campaigns", "/contact-lists", "/campaigns-config", "/campaign/:campaignId/report"]}
          render={() => <Redirect to="/tickets" />}
        />
      )}

      {planFlags.useCampaigns && (
        <Route path={campanhasPaths} render={() => <CampanhasModule />} />
      )}

      <Route path={equipePaths} render={() => <EquipeModule isAdmin={isAdmin} />} />

      <Route
        path={configPaths}
        render={() => <ConfiguracoesModule showExternalApi={planFlags.useExternalApi} />}
      />

      <Route exact path="/financeiro" component={Financeiro} />

      <Route exact path="/avaliacao" component={Evaluation} />
      <Route exact path="/tags" component={Tags} />
      <Route exact path="/files" component={Files} />
      <Route exact path="/helps" component={Helps} />
      <Route exact path="/announcements" component={Annoucements} />
      <Route exact path="/subscription" component={Subscription} />

      <Route render={() => <Redirect to="/tickets" />} />
    </Switch>
  );
}
